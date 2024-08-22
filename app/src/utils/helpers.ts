export function getGradientById(id: string) {
  function stringToNumber(id: string) {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
    return num;
  }

  const gradients = [
    ["#FF5F6D", "#FFC371"], // Gradient 1
    ["#36D1DC", "#5B86E5"], // Gradient 2
    ["#FFAFBD", "#ffc3a0"], // Gradient 3
    ["#2193b0", "#6dd5ed"], // Gradient 4
    ["#cc2b5e", "#753a88"], // Gradient 5
    ["#ee9ca7", "#ffdde1"], // Gradient 6
    ["#bdc3c7", "#2c3e50"], // Gradient 7
    ["#e96443", "#904e95"], // Gradient 8
    ["#de6262", "#ffb88c"], // Gradient 9
    ["#f46b45", "#eea849"], // Gradient 10
    ["#a8ff78", "#78ffd6"], // Gradient 11
    ["#ff0844", "#ffb199"], // Gradient 12
    ["#96e6a1", "#d4fc79"], // Gradient 13
    ["#56ab2f", "#a8e063"], // Gradient 14
    ["#108dc7", "#ef8e38"], // Gradient 15
    ["#fc00ff", "#00dbde"], // Gradient 16
    ["#74ebd5", "#ACB6E5"], // Gradient 17
    ["#16A085", "#F4D03F"], // Gradient 18
    ["#7F00FF", "#E100FF"], // Gradient 19
    ["#ff7e5f", "#feb47b"], // Gradient 20
  ];

  // Use the id to pick a gradient, using modulo to wrap around if id exceeds array length
  const index = stringToNumber(id) % gradients.length;
  return gradients[index];
}
