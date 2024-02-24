const video = document.getElementById("video-input");
const pedaco = document.getElementById("qrcode");
const canvas = document.getElementById("canvas-output");
const ctx = canvas.getContext("2d");  // Obtém o contexto 2D do canvas

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

        // Aplicar filtro de borda (opcional)
        let edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);

        // Encontrar contornos
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);


        // thresh
        let thresh = new cv.Mat();
        cv.threshold(gray, thresh, 90, 255, cv.THRESH_BINARY);

        // Identificar o retângulo grande
        let largeRectangle = null;
        let maxArea = 0;

        for (let i = 0; i < contours.size(); ++i) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);

            if (area > maxArea) {
                maxArea = area;
                largeRectangle = contour;
            }
        }

        // Desenhar o retângulo na imagem original
        if (largeRectangle) {
            let rect = cv.boundingRect(largeRectangle);
            cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), [0, 255, 0, 255], 2);
        }

        
        // Adiciona texto à imagem
        let text = "Gabarito da prova";
        let fontFace = cv.FONT_HERSHEY_SIMPLEX;
        let fontScale = 0.5;
        let textColor = new cv.Scalar(0, 0, 255); // (B, G, R)
        let thicknessText = 0.5;
        cv.putText(src, text, new cv.Point(10, 40), fontFace, fontScale, textColor, thicknessText, cv.LINE_AA);
        
        cv.rectangle(src, new cv.Point(10, 70), new cv.Point(190, 190), [0, 100, 0, 255], 2);
        let regionOfInterest = src.roi(new cv.Rect(10,70,190,190))
        // console.log(src, regionOfInterest);
        
        const qrDetectCode = new cv.QRCodeDetector();
        let qrcode = new cv.Mat();
        let result = new cv.Mat();
        let payload = qrDetectCode.detectAndDecode(regionOfInterest, qrcode, result)
        console.log(payload);

        // Exibe a imagem no canvas
        cv.imshow(canvas, src);
        cv.imshow(pedaco, regionOfInterest);

        let delay = 1000 / FDS - (Date.now() - begin);
        setTimeout(processVideo, delay);


        // Libera memória
        gray.delete();
        thresh.delete();
    }

    setTimeout(processVideo, 0);

})();
