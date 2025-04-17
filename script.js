window.addEventListener('load', () => {
    console.log("Client script loaded."); // Kiểm tra xem script đã load chưa
    // --- Khai báo biến toàn cục ---
    const video = document.getElementById('myVideo');
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let animationFrameId = null;

    if (!video) {
        console.error("Error: Video element not found!");
        return;
    }
    if (!canvas) {
        console.error("Error: Canvas element not found!");
        return;
    }
    if (!ctx) {
        console.error("Error: Canvas context could not be retrieved!");
        return;
    }

    // --- Thuật toán Sobel để phát hiện biên cạnh ---
    function applySobelFilter(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        // Chuyển đổi ảnh sang grayscale
        const grayData = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            grayData[i / 4] = gray;
        }

        const outputData = new Uint8ClampedArray(data.length);
        const Gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const Gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        const threshold = 50; // Ngưỡng phát hiện biên
        // Tạo một mảng mới để lưu trữ dữ liệu đầu ra
        // Lặp qua từng pixel trong ảnh (bỏ qua biên)
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sumX = 0;
                let sumY = 0;
                let kernelIndex = 0;
                for (let j = -1; j <= 1; j++) {
                    for (let i = -1; i <= 1; i++) {
                        const grayValue = grayData[(y + j) * width + (x + i)];
                        sumX += grayValue * Gx[kernelIndex];
                        sumY += grayValue * Gy[kernelIndex];
                        kernelIndex++;
                    }
                }
                // Tính toán độ lớn của gradient
                const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
                const edgeColor = magnitude > threshold ? 255 : 0; // Màu trắng nếu có biên, đen nếu không có biên
                const outputIndex = (y * width + x) * 4; // Tính chỉ số trong mảng dữ liệu đầu ra
                outputData[outputIndex] = edgeColor;
                outputData[outputIndex + 1] = edgeColor;
                outputData[outputIndex + 2] = edgeColor;
                outputData[outputIndex + 3] = 255; // Alpha
            }
        }
        return new ImageData(outputData, width, height);
    }

    // --- Hàm xử lý frame video ---
    function processFrame() {
        if (video.paused || video.ended) {
            animationFrameId = null; // Đặt lại ID để có thể play lại
            return; // Dừng nếu video không chạy
        }


        // 1. Vẽ frame video lên canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
            // 2. Lấy dữ liệu pixel
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // 3. Áp dụng bộ lọc Sobel
            let edgeData = applySobelFilter(imageData);
            // 4. Vẽ kết quả lên canvas
            ctx.putImageData(edgeData, 0, 0);
        } catch (e) {
            console.error("Error processing frame:", e);
            // Dừng xử lý nếu có lỗi (ví dụ: CORS)
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            return;
        }

        // 5. Lặp lại cho frame tiếp theo
        animationFrameId = requestAnimationFrame(processFrame);
    }

    // --- Gắn sự kiện ---
    video.addEventListener('play', () => {
        console.log("Video playing...");
        if (!animationFrameId) { // Chỉ bắt đầu nếu chưa chạy
            processFrame(); // Bắt đầu vòng lặp xử lý
        }
    });

    video.addEventListener('pause', () => {
        console.log("Video paused.");
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // Quan trọng: đặt lại ID để có thể play lại
        }
    });

    video.addEventListener('ended', () => {
        console.log("Video ended.");
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // Quan trọng: đặt lại ID
        }
    });

    // Xử lý khi không thể play video (ví dụ lỗi file)
    video.addEventListener('error', (e) => {
         console.error("Video Error:", e);
         alert("Không thể tải hoặc phát video. Vui lòng kiểm tra file video hoặc đường dẫn.");
    });

     // Đảm bảo kích thước canvas được đặt đúng ban đầu (quan trọng nếu CSS có thể thay đổi kích thước)
     // Hàm này chỉ cần chạy một lần khi load vì kích thước là cố định
     function setInitialCanvasSize() {
        canvas.width = video.width; // Lấy từ thuộc tính width của thẻ video
        canvas.height = video.height; // Lấy từ thuộc tính height của thẻ video
        console.log(`Initial canvas size set to: ${canvas.width}x${canvas.height}`);
     }
     setInitialCanvasSize(); // Gọi hàm này ngay khi script load


    console.log("Event listeners attached.");
});