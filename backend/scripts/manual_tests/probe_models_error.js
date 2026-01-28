const ort = require('onnxruntime-node');

async function probeShape(modelPath) {
    try {
        const session = await ort.InferenceSession.create(modelPath);
        console.log(`\n--- Probing ${modelPath} ---`);

        // Try just one size to get the error
        try {
            const i = 1;
            const data = Float32Array.from({ length: i }, () => Math.random());
            const tensor = new ort.Tensor('float32', data, [1, i]);
            await session.run({ float_input: tensor });
        } catch (e) {
            console.log(`ERROR for size 1:`, e.message);
        }
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await probeShape('./scaler.onnx');
    await probeShape('./learner_classifier_model.onnx');
}

run();
