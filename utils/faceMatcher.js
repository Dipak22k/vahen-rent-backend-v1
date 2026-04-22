const faceapi = require("face-api.js");
require("@tensorflow/tfjs"); // ✅ ADD THIS LINE
require("@tensorflow/tfjs-backend-cpu"); 
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// ✅ Load Models
async function loadModels() {
  const tf = require("@tensorflow/tfjs");

  await tf.setBackend("cpu");     // 🔥 MUST
  await tf.ready();               // 🔥 MUST

  console.log("✅ TF BACKEND:", tf.getBackend());

  const MODEL_PATH = __dirname + "/../models";

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

  console.log("✅ Face API Models Loaded");
}


// ✅ Match Faces
async function matchFaces(idImagePath, selfiePath) {
  console.log("ID IMAGE PATH:", idImagePath);
  console.log("SELFIE PATH:", selfiePath);

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

    console.log("DETECTION 1:", detection1);
    console.log("DETECTION 2:", detection2);

  // ❌ Face not detected
  if (!detection1 || !detection2) {
    console.log("❌ Face not detected");
    return { match: false, error: "NO_FACE_DETECTED" };
  }

  // ❌ Descriptor missing
  if (!detection1.descriptor || !detection2.descriptor) {
    console.log("❌ Invalid descriptors");
    return { match: false, error: "INVALID_DESCRIPTOR" };
  }

  const distance = faceapi.euclideanDistance(
    detection1.descriptor,
    detection2.descriptor
  );

  // ❌ NaN check
  if (isNaN(distance)) {
    console.log("❌ Distance is NaN");
    return { match: false, error: "INVALID_DISTANCE" };
  }

  console.log("🔥 FACE DISTANCE:", distance);

  // ✅ Better KYC logic
  let status = "rejected";

  if (distance < 0.55) status = "verified";
  else if (distance < 0.65) status = "manual_review";
  else status = "rejected";

  return {
    match: status === "verified",
    status,
    distance,
  };
}

async function matchWithMultipleSelfies(idImagePath, selfiePaths) {
  const img1 = await canvas.loadImage(idImagePath);

  const idDetection = await faceapi
    .detectSingleFace(
      img1,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!idDetection || !idDetection.descriptor) {
    return { match: false, error: "ID_FACE_FAILED" };
  }

  let bestDistance = 1; // higher = worse

  for (let path of selfiePaths) {
    const img = await canvas.loadImage(path);

    const detection = await faceapi
      .detectSingleFace(
        img,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.descriptor) {
      console.log("⚠️ Skipping bad selfie:", path);
      continue;
    }

    const distance = faceapi.euclideanDistance(
      idDetection.descriptor,
      detection.descriptor
    );

    console.log(`📸 Selfie distance (${path}):`, distance);

    if (distance < bestDistance) {
      bestDistance = distance;
    }
  }

  console.log("🔥 BEST DISTANCE:", bestDistance);

  return {
    match: bestDistance < 0.6,
    distance: bestDistance,
  };
}


module.exports = { 
  loadModels, 
  matchFaces, 
  matchWithMultipleSelfies 
};