{
  "name": "CapturedScene",
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "AI-generated description of the scene"
    },
    "image_url": {
      "type": "string",
      "description": "URL of the captured image"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "When the scene was captured"
    },
    "camera_type": {
      "type": "string",
      "enum": [
        "front",
        "back"
      ],
      "description": "Which camera was used"
    }
  },
  "required": [
    "description",
    "image_url",
    "timestamp"
  ]
}