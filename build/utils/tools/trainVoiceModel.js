"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPT_train = exports.SoVITS_train = exports.ExportParams = exports.OneClick = exports.Asr = exports.Denosie = exports.trainVoiceModel = exports.trainVoice = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const trainVoice = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.trainVoiceModel)(modelName);
    yield (0, exports.ExportParams)(modelName);
    yield (0, exports.Denosie)(modelName);
    yield (0, exports.Asr)(modelName);
    yield (0, exports.OneClick)(modelName);
    yield (0, exports.SoVITS_train)(modelName);
    yield (0, exports.GPT_train)(modelName);
    console.log("訓練完成");
});
exports.trainVoice = trainVoice;
// Helper function to create directory if it doesn't exist
function ensureDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.access(dir);
        }
        catch (_a) {
            yield promises_1.default.mkdir(dir, { recursive: true });
        }
    });
}
const executeCommand = (command, args, options) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const process = spawn(command, args, options);
        let output = '';
        let errorOutput = '';
        process.stdout.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;
            console.log(chunk);
        });
        process.stderr.on('data', (data) => {
            const chunk = data.toString();
            errorOutput += chunk;
            console.error(chunk);
        });
        process.on('close', (code) => {
            if (code !== 0) {
                const errorMessage = `Command exited with code ${code}. Error: ${errorOutput}`;
                console.error(errorMessage);
                resolve(`Error: ${errorMessage}\nOutput: ${output}`);
            }
            else {
                resolve(output);
            }
        });
        process.on('error', (error) => {
            const errorMessage = `Failed to start command: ${error.message}`;
            console.error(errorMessage);
            resolve(`Error: ${errorMessage}`);
        });
    });
});
// Command 1: Audio slicer
const trainVoiceModel = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const audioDir = `${process.env.dev_saveRecording}/${modelName}.wav`;
    const slicerDir = `output/slicer_opt/${modelName}`;
    yield ensureDir(slicerDir);
    const command = '/home/b310-21/miniconda3/envs/GPTSoVits/bin/python';
    const args = [
        'tools/slice_audio.py',
        audioDir,
        slicerDir,
        '-34', '4000', '300', '10', '500', '0.9', '0.25', '0', '1'
    ];
    return executeCommand(command, args, {
        shell: true,
        cwd: process.env.gptsovits_dir_path
    });
});
exports.trainVoiceModel = trainVoiceModel;
// Command 2: Voice denoising
const Denosie = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const slicerDir = `/home/b310-21/projects/GPT-SoVITS/output/slicer_opt/${modelName}`;
    const denoiseDir = `/home/b310-21/projects/GPT-SoVITS/output/denoise_opt/${modelName}`;
    yield ensureDir(denoiseDir);
    const command = '/home/b310-21/miniconda3/envs/GPTSoVits/bin/python';
    const args = [
        '/home/b310-21/projects/GPT-SoVITS/tools/cmd-denoise.py',
        '-i', slicerDir,
        '-o', denoiseDir,
        '-p', 'float16'
    ];
    return executeCommand(command, args, {
        shell: true,
        cwd: process.env.gptsovits_dir_path
    });
});
exports.Denosie = Denosie;
// Command 3: ASR (Automatic Speech Recognition)
const Asr = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const denoiseDir = `/home/b310-21/projects/GPT-SoVITS/output/denoise_opt/${modelName}`;
    const asrDir = `/home/b310-21/projects/GPT-SoVITS/output/asr_opt/${modelName}`;
    yield ensureDir(asrDir);
    const command = '/home/b310-21/miniconda3/envs/GPTSoVits/bin/python';
    const args = [
        '/home/b310-21/projects/GPT-SoVITS/tools/asr/funasr_asr.py',
        '-i', denoiseDir,
        '-o', asrDir,
        '-s', 'large', '-l', 'zh', '-p', 'float16'
    ];
    return executeCommand(command, args, {
        shell: true,
        cwd: process.env.gptsovits_dir_path
    });
});
exports.Asr = Asr;
// Command 4: One-click triple execution
const OneClick = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const envir = Object.assign(Object.assign({}, process.env), { inp_text: `/home/b310-21/projects/GPT-SoVITS/output/asr_opt/${modelName}/${modelName}.list`, inp_wav_dir: `/home/b310-21/projects/GPT-SoVITS/output/denoise_opt/${modelName}`, exp_name: `${modelName}`, i_part: "0", all_parts: "1", _CUDA_VISIBLE_DEVICES: "0", opt_dir: `/home/b310-21/projects/GPT-SoVITS/logs/${modelName}`, bert_pretrained_dir: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/chinese-roberta-wwm-ext-large", cnhubert_base_dir: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/chinese-hubert-base", pretrained_s2G: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/s2G488k.pth", s2config_path: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/configs/s2.json", is_half: "True", version: "v1" });
    const option = {
        cwd: process.env.gptsovits_dir_path,
        env: envir,
    };
    const scripts = [
        '/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/prepare_datasets/1-get-text.py',
        '/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/prepare_datasets/2-get-hubert-wav32k.py',
        '/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/prepare_datasets/3-get-semantic.py'
    ];
    for (const script of scripts) {
        yield executeCommand('/home/b310-21/miniconda3/envs/GPTSoVits/bin/python', [script], option);
    }
    return 'All Commands executed successfully';
});
exports.OneClick = OneClick;
// Command 5-0 export parameters
const ExportParams = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const envVars = {
        inp_text: `/home/b310-21/projects/GPT-SoVITS/output/asr_opt/${modelName}/${modelName}.list`,
        inp_wav_dir: `/home/b310-21/projects/GPT-SoVITS/output/denoise_opt/${modelName}`,
        exp_name: modelName,
        i_part: "0",
        all_parts: "1",
        _CUDA_VISIBLE_DEVICES: "0",
        opt_dir: `/home/b310-21/projects/GPT-SoVITS/logs/${modelName}`,
        bert_pretrained_dir: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/chinese-roberta-wwm-ext-large",
        cnhubert_base_dir: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/chinese-hubert-base",
        pretrained_s2G: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/s2G488k.pth",
        s2config_path: "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/configs/s2.json",
        is_half: "True",
        version: "v1"
    };
    console.log(`process.env.gptsovits_dir_path = ${process.env.gptsovits_dir_path}`);
    const exportCommands = Object.entries(envVars).join('\n');
    const envFilePath = path_1.default.join(process.env.gptsovits_dir_path, `${modelName}_env.sh`);
    yield promises_1.default.writeFile(envFilePath, exportCommands);
    return `Environment variables have been written to ${envFilePath}. You can source this file to use these variables in your shell.`;
});
exports.ExportParams = ExportParams;
// Command 5-1: SoVITS train
const SoVITS_train = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        "train": {
            "log_interval": 100,
            "eval_interval": 500,
            "seed": 1234,
            "epochs": 8,
            "learning_rate": 0.0001,
            "betas": [0.8, 0.99],
            "eps": 1e-9,
            "batch_size": 6,
            "fp16_run": true,
            "lr_decay": 0.999875,
            "segment_size": 20480,
            "init_lr_ratio": 1,
            "warmup_epochs": 0,
            "c_mel": 45,
            "c_kl": 1,
            "text_low_lr_rate": 0.4,
            "pretrained_s2G": "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/s2G488k.pth",
            "pretrained_s2D": "/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/s2D488k.pth",
            "if_save_latest": true,
            "if_save_every_weights": true,
            "save_every_epoch": 4,
            "gpu_numbers": "0"
        },
        "data": {
            "max_wav_value": 32768,
            "sampling_rate": 32000,
            "filter_length": 2048,
            "hop_length": 640,
            "win_length": 2048,
            "n_mel_channels": 128,
            "mel_fmin": 0,
            "mel_fmax": null,
            "add_blank": true,
            "n_speakers": 300,
            "cleaned_text": true,
            "exp_dir": `/home/b310-21/projects/GPT-SoVITS/logs/${modelName}`
        },
        "model": {
            "inter_channels": 192,
            "hidden_channels": 192,
            "filter_channels": 768,
            "n_heads": 2,
            "n_layers": 6,
            "kernel_size": 3,
            "p_dropout": 0.1,
            "resblock": "1",
            "resblock_kernel_sizes": [
                3, 7, 11
            ],
            "resblock_dilation_sizes": [
                [
                    1, 3, 5
                ],
                [
                    1, 3, 5
                ],
                [
                    1, 3, 5
                ]
            ],
            "upsample_rates": [
                10, 8, 2, 2, 2
            ],
            "upsample_initial_channel": 512,
            "upsample_kernel_sizes": [
                16, 16, 8, 2, 2
            ],
            "n_layers_q": 3,
            "use_spectral_norm": false,
            "gin_channels": 512,
            "semantic_frame_rate": "25hz",
            "freeze_quantizer": true
        },
        "s2_ckpt_dir": `/home/b310-21/projects/GPT-SoVITS/logs/${modelName}`,
        "content_module": "cnhubert",
        "save_weight_dir": "/home/b310-21/projects/GPT-SoVITS/SoVITS_weights",
        "name": `${modelName}`
    };
    const configPath = path_1.default.join(process.env.gptsovits_dir_path, 'TEMP', 'tmp_s2.json');
    yield promises_1.default.writeFile(configPath, JSON.stringify(config, null, 2));
    const logs2 = `/home/b310-21/projects/GPT-SoVITS/logs/${modelName}/logs_s2`;
    yield ensureDir(logs2);
    const command = '/home/b310-21/miniconda3/envs/GPTSoVits/bin/python';
    const args = ['/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/s2_train.py', '--config', configPath];
    return executeCommand(command, args, {
        shell: true,
        cwd: process.env.gptsovits_dir_path
    });
});
exports.SoVITS_train = SoVITS_train;
// Command 5-2: GPT train
const GPT_train = (modelName) => __awaiter(void 0, void 0, void 0, function* () {
    const config = `
        data:
        max_eval_sample: 8
        max_sec: 54
        num_workers: 4
        pad_val: 1024
        inference:
        top_k: 5
        model:
        EOS: 1024
        dropout: 0
        embedding_dim: 512
        head: 16
        hidden_dim: 512
        linear_units: 2048
        n_layer: 24
        phoneme_vocab_size: 512
        random_bert: 0
        vocab_size: 1025
        optimizer:
        decay_steps: 40000
        lr: 0.01
        lr_end: 0.0001
        lr_init: 1.0e-05
        warmup_steps: 2000
        output_dir: /home/b310-21/projects/GPT-SoVITS/logs/${modelName}/logs_s1
        pretrained_s1: /home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/pretrained_models/s1bert25hz-2kh-longer-epoch=68e-step=50232.ckpt
        train:
        batch_size: 6
        epochs: 15
        exp_name: ${modelName}
        gradient_clip: 1.0
        half_weights_save_dir: GPT_weights
        if_dpo: false
        if_save_every_weights: true
        if_save_latest: true
        precision: 16-mixed
        save_every_n_epoch: 5
        seed: 1234
        train_phoneme_path: /home/b310-21/projects/GPT-SoVITS/logs/${modelName}/2-name2text-0.txt
        train_semantic_path: /home/b310-21/projects/GPT-SoVITS/logs/${modelName}/6-name2semantic-0.tsv
    `;
    const configPath = path_1.default.join(process.env.gptsovits_dir_path, 'TEMP', 'tmp_s1.yaml');
    yield promises_1.default.writeFile(configPath, config);
    const command = '/home/b310-21/miniconda3/envs/GPTSoVits/bin/python';
    const args = ['/home/b310-21/projects/GPT-SoVITS/GPT_SoVITS/s1_train.py', '--config_file', configPath];
    return executeCommand(command, args, {
        shell: true,
        cwd: process.env.gptsovits_dir_path
    });
});
exports.GPT_train = GPT_train;
