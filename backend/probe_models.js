const ort = require('onnxruntime-node');

async function probeShape(modelPath) {
    try {
        const session = await ort.InferenceSession.create(modelPath);
        console.log(`\n--- Probing ${modelPath} ---`);

        for (let i = 1; i <= 10; i++) {
            try {
                const data = Float32Array.from({ length: i }, () => Math.random());
                const tensor = new ort.Tensor('float32', data, [1, i]);
                await session.run({ float_input: tensor });
                console.log(`PASS: Input size [1, ${i}] accepted.`);
                return i; // Found the size
            } catch (e) {
                // console.log(`FAIL: Input size [1, ${i}]`, e.message.split('\n')[0]);
            }
        }
        console.log("Could not determine shape in range 1-10.");
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    console.log("Probing scaler...");
    const size1 = await probeShape('./scaler.onnx');
    console.log("Probing classifier...");
    const size2 = await probeShape('./learner_classifier_model.onnx');
}

run();
