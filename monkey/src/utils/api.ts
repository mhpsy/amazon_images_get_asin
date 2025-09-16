const API_ENDPOINT = 'http://192.168.31.118:8000/api/upload-image'

export function uploadImage(imageBase64: string) {
  return new Promise((resolve, reject) => {
    fetch(API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => resolve(data))
      .catch(error => reject(error))
  })
}
