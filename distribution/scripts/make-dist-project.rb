#!/usr/bin/env ruby
# Generate a standalone, CocoaPods-free distribution Xcode project that builds
# our mixed Swift + ObjC++ module + baked codegen into react_native_zello_sdk.xcframework.
# Compiles against RN 0.87 SPM header products + ZelloSDKUmbrella; React/ZelloSDK
# symbols are resolved at runtime from the host app (dynamic_lookup), so the
# binary carries no RN-version-pinned framework load commands.
require 'xcodeproj'

OUT      = ARGV[0]   # abs path to the .xcodeproj to create
REPO_IOS = ARGV[1]   # abs path to repo ios/
XCF_PKG  = ARGV[2]   # abs path to the ReactNative SPM header package dir (build/xcframeworks)
XCF_DIR  = ARGV[3]   # abs path to build/xcframeworks/debug (for React.xcframework headers)
TARGET = 'react_native_zello_sdk'

project = Xcodeproj::Project.new(OUT)
target = project.new_target(:framework, TARGET, :ios, '17.0')

codegen = "#{REPO_IOS}/generated/build/generated/ios/ReactCodegen"
target.build_configurations.each do |c|
  bs = c.build_settings
  bs['PRODUCT_NAME'] = TARGET
  bs['PRODUCT_MODULE_NAME'] = TARGET
  bs['DEFINES_MODULE'] = 'YES'
  bs['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
  bs['SWIFT_VERSION'] = '5.0'
  bs['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
  bs['CLANG_CXX_LIBRARY'] = 'libc++'
  bs['GCC_PREPROCESSOR_DEFINITIONS'] = ['$(inherited)', 'RCT_NEW_ARCH_ENABLED=1']
  bs['OTHER_SWIFT_FLAGS'] = ['$(inherited)', '-DRCT_NEW_ARCH_ENABLED']
  bs['CODE_SIGNING_ALLOWED'] = 'NO'
  bs['SKIP_INSTALL'] = 'NO'
  bs['DEFINES_MODULE'] = 'YES'
  # React/ZelloSDK symbols come from the host app at runtime.
  bs['OTHER_LDFLAGS'] = ['$(inherited)', '-undefined', 'dynamic_lookup']
  bs['HEADER_SEARCH_PATHS'] = ['$(inherited)', codegen, "#{codegen}/RNZelloSdkSpec"]
  # React.xcframework carries the ObjC React/* headers (RCTBridgeModule etc.).
  bs['FRAMEWORK_SEARCH_PATHS'] = ['$(inherited)', XCF_DIR]
end

grp = project.main_group.new_group('Sources')
srcs = [
  "#{REPO_IOS}/ZelloSdkModule.mm",
  "#{REPO_IOS}/ZelloSdkModuleImpl.swift",
  "#{REPO_IOS}/ZelloIOSSdkModule.swift",
  "#{REPO_IOS}/ZelloIOSSdkModuleBridge.m",
  "#{codegen}/RNZelloSdkSpec/RNZelloSdkSpec-generated.mm",
] + Dir.glob("#{REPO_IOS}/Extensions/*.swift").sort
srcs.each { |f| target.source_build_phase.add_file_reference(grp.new_file(f)) }
["#{REPO_IOS}/ZelloSdkModule.h", "#{REPO_IOS}/ZelloIOSSdkModuleBridge.h"].each { |h| grp.new_file(h) }

# SPM: ReactNative header package (local) + ios-mobile-sdk (remote) for headers/import.
rn = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
rn.relative_path = XCF_PKG
project.root_object.package_references << rn

zello = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
zello.repositoryURL = 'https://github.com/zelloptt/ios-mobile-sdk'
zello.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => '3.3.2' }
project.root_object.package_references << zello

def add_product(project, target, pkg, name)
  dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
  dep.package = pkg
  dep.product_name = name
  target.package_product_dependencies << dep
  bf = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  bf.product_ref = dep
  target.frameworks_build_phase.files << bf
end
%w[ReactHeaders ReactNativeHeaders ReactNativeDependenciesHeaders].each { |n| add_product(project, target, rn, n) }
add_product(project, target, zello, 'ZelloSDKUmbrella')

project.save
puts "created #{OUT}"
puts "sources: #{target.source_build_phase.files.count}"
