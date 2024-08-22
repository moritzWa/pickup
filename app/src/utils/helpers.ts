export function getGradientById(id: string) {
  function stringToNumber(id: string) {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
    return num;
  }

  const gradients = [
    ["#FF3E50", "#FFC100"], // Gradient 1
    ["#00E1FF", "#7F9FFF"], // Gradient 2
    ["#FF80A0", "#FFB389"], // Gradient 3
    ["#00AFFF", "#7DF9FF"], // Gradient 4
    ["#E02D75", "#9144BB"], // Gradient 5
    ["#FF80A7", "#FFDBE5"], // Gradient 6
    ["#BDC3C7", "#34495E"], // Gradient 7
    ["#FF5C5C", "#A14D9F"], // Gradient 8
    ["#E86E6E", "#FFAD96"], // Gradient 9
    ["#FF8345", "#FFB92E"], // Gradient 10
    ["#90FF5E", "#5FFFCE"], // Gradient 11
    ["#FF1E62", "#FFB29D"], // Gradient 12
    ["#90FF91", "#E2FF8F"], // Gradient 13
    ["#6BCC2A", "#BBFF91"], // Gradient 14
    ["#00C8FF", "#FF8433"], // Gradient 15
    ["#74E5FF", "#D9E6FF"], // Gradient 16
    ["#17D585", "#FFDC00"], // Gradient 17
    ["#9F00FF", "#E600FF"], // Gradient 18
    ["#FF6B5F", "#FFAB79"], // Gradient 19
    ["#FF7B3E", "#FFEB67"], // Gradient 20
  ];

  // Use the id to pick a gradient, using modulo to wrap around if id exceeds array length
  const index = stringToNumber(id) % gradients.length;
  return gradients[index];
}
