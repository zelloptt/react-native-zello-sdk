extension UIImage {
  var base64String: String? {
    guard let string = self.jpegData(compressionQuality: 1.0)?
      .base64EncodedString(options: .lineLength64Characters) else {
      return nil
    }
    return "data:image/jpeg;base64," + string
  }
}
