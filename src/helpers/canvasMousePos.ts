const canvasMousePos = (canvas: HTMLCanvasElement, mouseX: number, mouseY: number): {x: number, y: number} => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (mouseX - rect.left) * scaleX,
    y: (mouseY - rect.top) * scaleY
  };
};

export default canvasMousePos;
