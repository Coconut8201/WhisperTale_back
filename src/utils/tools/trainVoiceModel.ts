import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
dotenv.config();
export const genVoice = async (storyId: string, voiceName: string) => {
    await genFishVoice(storyId, voiceName);
    console.log("訓練完成")
}

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
export const genFishVoice = async (storyId: string, voiceName: string): Promise<boolean> => {
    try {
        const saveVoicePath = `${process.env.dev_saveAudio}/${storyId}`;
        
        await ensureDir(saveVoicePath)
        
        const command = 'python';
        const args = [
            '-m', 'tools.api_client',
            '--url', process.env.fishSpeechApi as string,
            '--text', '中華隊在這屆世界12強棒球賽中，3度與日本隊交手，前2戰都不敵日本，但在冠軍戰中，5局上靠著林家正的陽春砲、陳傑憲3分全壘打，一口氣灌進4分，且整場TEAM TAIWAN皆拿出絕佳表現，最後成功以4比0完封日本，讓地主隊日本銀恨，也切斷了日本隊在國際賽事中的27連勝神話，全國為之振奮。賽後，棒球熱也在全台持續延燒，近日有網友發現，連鎖書局墊腳石外，竟出現滿滿的排隊人潮，後來才知道民眾都是為了搶購12月號的《職業棒球》雜誌，留言區也意外釣到中華職棒聯盟會長蔡其昌的留言感謝。中華隊在這屆世界12強棒球賽中，3度與日本隊交手，前2戰都不敵日本，但在冠軍戰中，5局上靠著林家正的陽春砲、陳傑憲3分全壘打，一口氣灌進4分，且整場TEAM TAIWAN皆拿出絕佳表現，最後成功以4比0完封日本，讓地主隊日本銀恨，也切斷了日本隊在國際賽事中的27連勝神話，全國為之振奮。賽後，棒球熱也在全台持續延燒，近日有網友發現，連鎖書局墊腳石外，竟出現滿滿的排隊人潮，後來才知道民眾都是為了搶購12月號的《職業棒球》雜誌，留言區也意外釣到中華職棒聯盟會長蔡其昌的留言感謝。中華隊在這屆世界12強棒球賽中，3度與日本隊交手，前2戰都��敵日本，但在冠軍戰中，5局上靠著林家正的陽春砲、陳傑憲3分全壘打，一口氣灌進4分，且整場TEAM TAIWAN皆拿出絕佳表現，最後成功以4比0完封日本，讓地主隊日本銀恨，也切斷了日本隊在國際賽事中的27連勝神話，全國為之振奮。賽後，棒球熱也在全台持續延燒，近日有網友發現，連鎖書局墊腳石外，竟出現滿滿的排隊人潮，後來才知道民眾都是為了搶購12月號的《職業棒球》雜誌，留言區也意外釣到中華職棒聯盟會長蔡其昌的留言感謝。',
            '--reference_audio', '/home/b310-21/project/voice/aasc.wav',
            '--reference_text', '我認為重症照護是生死交界的最前線。在這個高壓的環境中，每一位從事重症照護的醫護人員都接受了最專業的訓練，具備應對突發狀況的能力。',
            '--format', 'wav',
            '--output', path.join(saveVoicePath, `${voiceName}.wav`),
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