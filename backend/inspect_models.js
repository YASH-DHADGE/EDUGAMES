const ort = require('onnxruntime-node');

async function inspect(modelPath) {
    try {
        const session = await ort.InferenceSession.create(modelPath);
        console.log(`\n--- Inspecting ${modelPath} ---`);
        console.log('Input Names:', session.inputNames);
        console.log('Output Names:', session.outputNames);

        // Try to get input details if available (depends on ONNX version/metadata)
        // For simple inspection, inputNames is often enough to infer, but let's assume we need to guess features.
    } catch (e) {
        console.error(`Error loading ${modelPath}:`, e);
    }
}

async function run() {
    await inspect('./scaler.onnx');
    await inspect('./learner_classifier_model.onnx');
}

run();
