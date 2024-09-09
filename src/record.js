let stream;
let mediaRecorder;
let recordedChunks = [];

async function updateAudioInputDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputSelect = document.getElementById('audioInput');
        const stopRecordButton = document.getElementById('stopRecordButton');
        stopRecordButton.disabled = true;

        audioInputSelect.innerHTML = '';
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        
        audioInputDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${device.deviceId}`;
            audioInputSelect.appendChild(option);
        });

        if (audioInputDevices.length > 0) {
            audioInputSelect.value = audioInputDevices[0].deviceId;
        }
    } catch (error) {
        console.error('오디오 장치 목록을 가져오는 중 오류 발생:', error);
    }
}

async function getMediaStreams() {
    try {

        const audioInputSelect = document.getElementById('audioInput');
        const selectedDeviceId = audioInputSelect.value;

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 60 },
            },
            audio: true
        });

        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,

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

async function startRecording() {
    stream = await getMediaStreams();

    if (!stream) {
        console.error("스트림을 가져오지 못했습니다.");
        return;
    }

    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' 
    });

    const startRecordButton = document.getElementById('startRecordButton');
    const stopRecordButton = document.getElementById('stopRecordButton');
        startRecordButton.disabled = true;
        stopRecordButton.disabled = false;

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const preview = document.getElementById('preview');
        preview.src = url;
        preview.style.display = 'block';

        const downloadButton = document.getElementById('downloadButton');
        downloadButton.href = url;
        downloadButton.style.display = 'block';
        startRecordButton.disabled = false;
        stopRecordButton.disabled = true;
    };
    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }

    if(stream) {
        stream.getTracks().forEach(track => track.stop());

    }
    stream = undefined
}

function downloadRecording() {
    const downloadButton = document.getElementById('downloadButton');
    const a = document.createElement('a');
    a.href = downloadButton.href;
    a.download = 'record.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

window.addEventListener('load', updateAudioInputDevices);
