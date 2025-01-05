import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
dotenv.config();

// 確認目標dir 存在
async function ensureDir(dir: string) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

const executeCommand = async (command: string, args: string[], options: any): Promise<string> => {
    return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const process = spawn(command, args, options);
        let output = '';
        let errorOutput = '';
        process.stdout.on('data', (data: Buffer) => {
            const chunk = data.toString();
            output += chunk;
            console.log(chunk);
        });

        process.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            errorOutput += chunk;
            console.error(chunk);
        });

        process.on('close', (code: number) => {
            if (code !== 0) {
                const errorMessage = `Command exited with code ${code}. Error: ${errorOutput}`;
                console.error(errorMessage);
                resolve(`Error: ${errorMessage}\nOutput: ${output}`);
            } else {
                resolve(output);
            }
        });

        process.on('error', (error: Error) => {
            const errorMessage = `Failed to start command: ${error.message}`;
            console.error(errorMessage);
            resolve(`Error: ${errorMessage}`);
        });
    });
};

// 用f5tts 生成聲音
export const genF5ttsVoice = async (userId: string, storyId: string, storyText: string, voiceName: string, userVoiceName: string): Promise<boolean> => {
    try {
        const saveVoicePath = `${process.env.dev_saveF5ttsAudio}/user_${userId}/story_${storyId}`;
        const userVoicePath = `${process.env.dev_saveRecording}/user_${userId}/${userVoiceName}`;
        
        const files = await fs.readdir(userVoicePath);
        const wavFile = files.find(file => file.endsWith('.wav'));
        
        await ensureDir(saveVoicePath);

        const command = 'f5-tts_infer-cli';
        const args = [
            '--model', "F5-TTS",
            '--ref_audio', `${userVoicePath}/${wavFile}`,
            '--ref_text', '""',
            '--gen_text', storyText as string,
            '--output_dir', saveVoicePath as string,
            '--output_file', `${voiceName}.wav`,
            '--remove_silence',
            '--speed', '0.9'
        ];

        const result = await executeCommand(command, args, {
            shell: true,
            cwd: process.env.f5ttsDir
        });

        return !result.includes('Error:');
    } catch (error) {
        console.error('生成語音時發生錯誤:', error);
        return false;
    }
};