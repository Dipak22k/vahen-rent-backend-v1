const faceapi = require("face-api.js");
require("@tensorflow/tfjs"); // ✅ ADD THIS LINE
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// ✅ Load Models
async function loadModels() {
  const MODEL_PATH = __dirname + "/../models";

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  console.log("✅ Face API Models Loaded");
}

// ✅ Match Faces
async function matchFaces(idImagePath, selfiePath) {
  const img1 = await canvas.loadImage(idImagePath);
  const img2 = await canvas.loadImage(selfiePath);

  const detection1 = await faceapi
    .detectSingleFace(img1)
    .withFaceLandmarks()
    .withFaceDescriptor();

  const detection2 = await faceapi
    .detectSingleFace(img2)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection1 || !detection2) {
    return { match: false, error: "NO_FACE_DETECTED" };
  }

  const distance = faceapi.euclideanDistance(
    detection1.descriptor,
    detection2.descriptor
  );

  return { match: distance < 0.6 };
}

module.exports = { loadModels, matchFaces };