import ZelloSDK

extension ZelloTranscription {
  var jsonDictionary: [AnyHashable: Any] {
    return [
      "text": text,
      "language": language,
      "isTruncated": isTruncated,
      "confidence": confidence,
      "translations": translations.map { translation in
        [
          "text": translation.text,
          "language": translation.language
        ]
      }
    ]
  }
}
