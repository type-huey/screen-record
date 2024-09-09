async function getMediaStreams() {
    try {

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 60 },
            }
        });

        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 },  
                echoCancellation: false,     
                noiseSuppression: false,     
                autoGainControl: false       
            }
        });

        const combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);

        return combinedStream;
    } catch (err) {
        console.error("화면 및 오디오 스트림을 가져오는 중 오류 발생:", err);
        return undefined;
    }
}

let mediaRecorder
let recordedChunks = [];

async function startRecording() {
    const stream = await getMediaStreams();

    if (!stream) {
        console.error("스트림을 가져오지 못했습니다.");
        return;
    }

    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' 
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}