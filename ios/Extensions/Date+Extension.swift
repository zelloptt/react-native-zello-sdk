extension Date {
  var bridgeTimestamp: String {
    String(timeIntervalSince1970 * 1000)
  }
}
