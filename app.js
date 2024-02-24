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

        // Encontrar contornos
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Encontrar o maior contorno (assumindo que seja o retângulo)
        let maxContour = null;
        let maxArea = 0;
        for (let i = 0; i < contours.size(); ++i) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
            if (area > maxArea) {
                maxArea = area;
                maxContour = contour;
            }
        }

        // Desenhar o maior contorno (retângulo) na matriz
        if (maxContour !== null) {
            let rect = cv.boundingRect(maxContour);
            let startPoint = new cv.Point(rect.x, rect.y);
            let endPoint = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            let color = new cv.Scalar(255, 0, 0); // (B, G, R)
            let thickness = 2;
            cv.rectangle(thresh, startPoint, endPoint, color, thickness);
        }

        // Adiciona texto à imagem
        let text = "Gabarito da prova";
        let fontFace = cv.FONT_HERSHEY_SIMPLEX;
        let fontScale = 0.5;
        let textColor = new cv.Scalar(0, 255, 0); // (B, G, R)
        let thicknessText = 0.5;
        cv.putText(thresh, text, new cv.Point(10, 40), fontFace, fontScale, textColor, thicknessText, cv.LINE_AA);

        // Exibe a imagem no canvas
        cv.imshow(canvas, thresh);

        let delay = 1000 / FDS - (Date.now() - begin);
        setTimeout(processVideo, delay);

        // Libera memória
        gray.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
    }

    setTimeout(processVideo, 0);

})();
