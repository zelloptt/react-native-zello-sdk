#!/usr/bin/env ruby
# Wire the native ZelloSDK (github.com/zelloptt/ios-mobile-sdk, product
# ZelloSDKUmbrella) into the example over SPM, mirroring zello-ios-sdk-example-spm:
#   - app target: LINK + EMBED (ZelloSDKUmbrella is a `.dynamic` product)
#   - NotificationServiceExtension: LINK only (it finds the dylib in the host app)
# Idempotent: safe to re-run.
require 'xcodeproj'

PROJ = ARGV[0] or abort 'usage: wire-zellosdk-spm.rb <path.xcodeproj>'
REPO = 'https://github.com/zelloptt/ios-mobile-sdk'
PRODUCT = 'ZelloSDKUmbrella'
MIN_VERSION = '3.3.2'

project = Xcodeproj::Project.open(PROJ)

app = project.targets.find { |t| t.name == 'ZelloSdkExample' }
ext = project.targets.find { |t| t.name == 'NotificationServiceExtension' }
abort 'app target not found' unless app
abort 'extension target not found' unless ext

# 1) Project-level remote package reference (dedup by URL).
pkg = project.root_object.package_references.find do |r|
  r.isa == 'XCRemoteSwiftPackageReference' && r.repositoryURL == REPO
end
if pkg.nil?
  pkg = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
  pkg.repositoryURL = REPO
  pkg.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => MIN_VERSION }
  project.root_object.package_references << pkg
  puts "+ added remote package #{REPO} (upToNextMajor #{MIN_VERSION})"
else
  pkg.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => MIN_VERSION }
  puts "= remote package #{REPO} already present (requirement normalized)"
end

# Helper: a per-target XCSwiftPackageProductDependency for ZelloSDKUmbrella.
def product_dep_for(project, target, pkg, product)
  dep = target.package_product_dependencies.find { |d| d.product_name == product }
  return dep if dep
  dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
  dep.package = pkg
  dep.product_name = product
  target.package_product_dependencies << dep
  puts "+ #{target.name}: product dependency #{product}"
  dep
end

# Helper: ensure the product is in the target's frameworks (link) phase.
def ensure_linked(project, target, dep, product)
  phase = target.frameworks_build_phase
  if phase.files.any? { |f| f.product_ref == dep }
    puts "= #{target.name}: already links #{product}"
    return
  end
  bf = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  bf.product_ref = dep
  phase.files << bf
  puts "+ #{target.name}: link #{product}"
end

# Helper: ensure an Embed Frameworks copy phase carries the product (app only).
def ensure_embedded(project, target, dep, product)
  phase = target.copy_files_build_phases.find do |p|
    p.symbol_dst_subfolder_spec == :frameworks
  end
  if phase.nil?
    phase = project.new(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
    phase.name = 'Embed Frameworks'
    phase.symbol_dst_subfolder_spec = :frameworks
    target.build_phases << phase
    puts "+ #{target.name}: created Embed Frameworks phase"
  end
  if phase.files.any? { |f| f.product_ref == dep }
    puts "= #{target.name}: already embeds #{product}"
    return
  end
  bf = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  bf.product_ref = dep
  bf.settings = { 'ATTRIBUTES' => %w[CodeSignOnCopy RemoveHeadersOnCopy] }
  phase.files << bf
  puts "+ #{target.name}: embed #{product} (CodeSignOnCopy)"
end

# 2) App: link + embed.
app_dep = product_dep_for(project, app, pkg, PRODUCT)
ensure_linked(project, app, app_dep, PRODUCT)
ensure_embedded(project, app, app_dep, PRODUCT)

# 3) Extension: link only.
ext_dep = product_dep_for(project, ext, pkg, PRODUCT)
ensure_linked(project, ext, ext_dep, PRODUCT)

# 4) Extension deployment target -> iOS 17 (ZelloSDK SPM min, matches reference).
ext.build_configurations.each do |c|
  cur = c.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
  if cur.nil? || cur.to_f < 17.0
    c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
    puts "+ #{ext.name}/#{c.name}: IPHONEOS_DEPLOYMENT_TARGET #{cur.inspect} -> 17.0"
  else
    puts "= #{ext.name}/#{c.name}: IPHONEOS_DEPLOYMENT_TARGET already #{cur}"
  end
end

project.save
puts 'saved.'
