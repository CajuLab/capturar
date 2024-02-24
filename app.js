const video = document.getElementById("video-input");
const canvas = document.getElementById("canvas-output");

(async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    })

    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let cap = new cv.VideoCapture(video);

    video.srcObject = stream;
    video.play();

    const FDS = 30;

    function processVideo() {
        let begin = Date.now();

        cap.read(src);

        // tons de cinza
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // thresh
        let thresh = new cv.Mat();
        cv.threshold(gray, thresh, 90, 255, cv.THRESH_BINARY);
        

        // Desenha um retângulo na matriz
        let startPoint = new cv.Point(10, 50);
        let endPoint = new cv.Point(300, 200);
        let color = new cv.Scalar(0, 255, 0); // (B, G, R)
        let thickness = 5;
        cv.rectangle(thresh, startPoint, endPoint, color, thickness);

        // Adiciona texto à imagem
        let text = "Gabarito da prova";
        let fontFace = cv.FONT_HERSHEY_SIMPLEX;
        let fontScale = 0.2;
        let textColor = new cv.Scalar(0, 255, 0); // (B, G, R)
        let thicknessText = 1;
        cv.putText(thresh, text, new cv.Point(10, 40), fontFace, fontScale, textColor, thicknessText, cv.LINE_AA);

        // Exibe a imagem no canvas
        cv.imshow(canvas, thresh);

        let delay = 1000 / FDS - (Date.now() - begin);
        setTimeout(processVideo, delay);

        // Libera memória
        gray.delete();
        thresh.delete();
    }

    setTimeout(processVideo, 0);

})();
