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

// 用fish speech 生成聲音
export const genFishVoice = async ( userId: string, storyId: string, storyText: string, voiceName: string ): Promise<boolean> => {
    try {
        const saveVoicePath = `${process.env.dev_saveAudio}/user_${userId}/story_${storyId}`;
        const voiceText = await fs.readFile(`${saveVoicePath}/info.txt`, 'utf-8');
        await ensureDir(saveVoicePath);
        const command = 'python';
        const args = [
            '-m', 'tools.api_client',
            '--url', process.env.fishSpeechApi as string,
            '--text', `\"${storyText}。\"`,
            '--reference_audio', '/home/b310-21/project/voice/aasc.wav',
            '--reference_text', '我認為重症照護是生死交界的最前線。在這個高壓的環境中，每一位從事重症照護的醫護人員都接受了最專業的訓練，具備應對突發狀況的能力。',
            // '--reference_text', voiceText,
            '--format', 'wav',
            '--output', path.join(saveVoicePath, `${voiceName}`),
            '--play', 'False'
        ];

        const result = await executeCommand(command, args, {
            shell: true,
            cwd: process.env.fishSpeechDir
        });

        // 檢查結果是否包含錯誤訊息
        return !result.includes('Error:');
    } catch (error) {
        console.error('生成語音時發生錯誤:', error);
        return false;
    }
};