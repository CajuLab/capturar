const video = document.getElementById("video-input");
const pedaco = document.getElementById("qrcode");
const canvas = document.getElementById("canvas-output");
const ctx = canvas.getContext("2d");  // Obtém o contexto 2D do canvas

(async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
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
        let text = "QRcode prova";
        let fontFace = cv.FONT_HERSHEY_SIMPLEX;
        let fontScale = 0.35;
        let textColor = new cv.Scalar(0, 0, 255); // (B, G, R)
        let thicknessText = 0.5;

        cv.putText(src, text, new cv.Point(20, 430), fontFace, fontScale, textColor, thicknessText, cv.LINE_AA);
        
        cv.rectangle(src, new cv.Point(20, 440), new cv.Point(100, 520), [255, 100, 0, 255], 2);
        let regionOfInterest = src.roi(new cv.Rect(20,440,80,80))
        
        const qrDetectCode = new cv.QRCodeDetector();
        let qrcode = new cv.Mat();
        let result = new cv.Mat();
        let payload = qrDetectCode.detectAndDecode(regionOfInterest, qrcode, result)

        // Exibe a imagem no canvas
        cv.imshow(canvas, src);
        cv.imshow(pedaco, regionOfInterest);

        let delay = 1000 / FDS - (Date.now() - begin);
        setTimeout(processVideo, delay);

        if(payload){
            const apito = new Audio('aviso.mp3');
            apito.play();

            alert(payload)
            const dataURL = canvasOutput.toDataURL();
    
            fetch(`${API_URL}` + '/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: dataURL,
            }),
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch((error) => {
                console.error('Error:', error);
            });
        }

        // Libera memória
        gray.delete();
        edges.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
        qrcode.delete();
        result.delete();
    }

    setTimeout(processVideo, 0);

})();
