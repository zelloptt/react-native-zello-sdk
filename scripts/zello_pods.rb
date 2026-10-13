# CocoaPods helper for @zelloptt/react-native-zello-sdk.
#
# The native ZelloSDK is consumed through Swift Package Manager (product `ZelloSDKUmbrella`).
# `spm_dependency` in the podspec only wires the package into the bridge pod inside
# Pods.xcodeproj; the app (and its extensions) must also link the dynamic product, and the
# app must embed it. `zello_post_install` does that in the user's Xcode project.
#
#   require Pod::Executable.execute_command('node', ['-p',
#     "require.resolve('@zelloptt/react-native-zello-sdk/scripts/zello_pods.rb', {paths: [process.argv[1]]})",
#     __dir__]).strip
#
#   post_install do |installer|
#     zello_post_install(installer, app_target: 'MyApp', extension_targets: ['NotificationServiceExtension'])
#     react_native_post_install(...)
#   end
require 'xcodeproj'
require_relative 'zello_sdk_requirement'

ZELLO_EXTENSION_RUNPATH = '@executable_path/../../Frameworks'

def zello_post_install(installer, app_target:, extension_targets: [])
  leftover = installer.pod_targets.select { |t| t.pod_name == 'ZelloSDK' }
  unless leftover.empty?
    raise "[react-native-zello-sdk] Pod target(s) #{leftover.map(&:name).join(', ')} found: the native ZelloSDK now comes " \
          "from Swift Package Manager. Remove `pod 'ZelloSDK'` from your Podfile (`npx @zelloptt/react-native-zello-sdk setup-ios` does it for you)."
  end

  aggregate = installer.aggregate_targets.find { |t| t.user_targets.map(&:name).include?(app_target) }
  user_project = aggregate&.user_project
  raise "[react-native-zello-sdk] App target '#{app_target}' not found in any project integrated by your Podfile." unless user_project

  app = user_project.targets.find { |t| t.name == app_target }
  extensions = Array(extension_targets).map do |name|
    user_project.targets.find { |t| t.name == name } ||
      raise("[react-native-zello-sdk] Extension target '#{name}' not found in #{File.basename(user_project.path)}.")
  end

  ([app] + extensions).each { |t| zello_check_deployment_target!(t) }

  package = zello_ensure_package_reference(user_project)
  zello_link_product(user_project, app, package, embed: true)
  extensions.each do |ext|
    zello_link_product(user_project, ext, package, embed: false)
    zello_ensure_extension_runpath(ext)
  end

  # CocoaPods only saves the user project for targets it integrates, so a no-op install would not persist this.
  user_project.save
end

def zello_check_deployment_target!(target)
  minimum = Gem::Version.new(ZELLO_MIN_IOS_VERSION)
  target.resolved_build_setting('IPHONEOS_DEPLOYMENT_TARGET', true).each do |config, value|
    next if value.nil?

    version = begin
      Gem::Version.new(value.to_s)
    rescue ArgumentError
      next
    end
    next if version >= minimum

    raise "[react-native-zello-sdk] Target '#{target.name}' (#{config}) has IPHONEOS_DEPLOYMENT_TARGET #{value}; " \
          "ZelloSDK requires iOS #{ZELLO_MIN_IOS_VERSION} or later."
  end
end

def zello_ensure_package_reference(project)
  klass = Xcodeproj::Project::Object::XCRemoteSwiftPackageReference
  package = project.root_object.package_references.find { |r| r.is_a?(klass) && r.repositoryURL == ZELLO_SDK_URL }
  unless package
    package = project.new(klass)
    package.repositoryURL = ZELLO_SDK_URL
    project.root_object.package_references << package
  end
  package.requirement = ZELLO_SDK_REQUIREMENT.dup if zello_replace_requirement?(package.requirement)
  package
end

# Keeps an app's own requirement unless it is missing or an `upToNextMajorVersion` below ours.
def zello_replace_requirement?(current)
  return true if current.nil? || current.empty?
  return false unless current['kind'] == ZELLO_SDK_REQUIREMENT['kind']

  Gem::Version.new(current['minimumVersion'].to_s) < Gem::Version.new(ZELLO_SDK_REQUIREMENT['minimumVersion'])
rescue ArgumentError
  false
end

def zello_link_product(project, target, package, embed:)
  dependency = target.package_product_dependencies.find { |d| d.product_name == ZELLO_SDK_PRODUCT && d.package == package }
  unless dependency
    dependency = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
    dependency.product_name = ZELLO_SDK_PRODUCT
    dependency.package = package
    target.package_product_dependencies << dependency
  end

  unless target.frameworks_build_phase.files.any? { |f| f.product_ref == dependency }
    build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
    build_file.product_ref = dependency
    target.frameworks_build_phase.files << build_file
  end
  return unless embed

  phase = target.copy_files_build_phases.find { |p| p.name == 'Embed Frameworks' && p.dst_subfolder_spec == '10' }
  unless phase
    phase = target.new_copy_files_build_phase('Embed Frameworks')
    phase.dst_subfolder_spec = '10'
  end
  return if phase.files.any? { |f| f.product_ref == dependency }

  build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  build_file.product_ref = dependency
  build_file.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy'] }
  phase.files << build_file
end

# Extensions link the product but do not embed it; it is loaded from the host app's Frameworks directory.
def zello_ensure_extension_runpath(target)
  target.build_configurations.each do |config|
    paths = config.build_settings['LD_RUNPATH_SEARCH_PATHS'] || ['$(inherited)']
    next if Array(paths.is_a?(String) ? paths.split : paths).include?(ZELLO_EXTENSION_RUNPATH)

    config.build_settings['LD_RUNPATH_SEARCH_PATHS'] =
      paths.is_a?(String) ? "#{paths} #{ZELLO_EXTENSION_RUNPATH}" : paths + [ZELLO_EXTENSION_RUNPATH]
  end
end
