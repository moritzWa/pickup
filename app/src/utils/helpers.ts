export function getGradientById(id: string) {
  function stringToNumber(id: string) {
    let num = 0;
    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
    return num;
  }

  const gradients = [
    ["#FFB6B6", "#FFE5A1"], // Gradient 1
    ["#B3E9FF", "#CFDFFF"], // Gradient 2
    ["#FFCDD9", "#FFE2CF"], // Gradient 3
    ["#99E5FF", "#C7FBFF"], // Gradient 4
    ["#F5A6C2", "#C4A3E1"], // Gradient 5
    ["#FFC8D5", "#FFF1F6"], // Gradient 6
    ["#FFB1B1", "#C491BD"], // Gradient 8
    ["#F3A6A6", "#FFDFC8"], // Gradient 9
    ["#FFCC99", "#FFDBA3"], // Gradient 10
    ["#C6FFB2", "#ADFFE9"], // Gradient 11
    ["#FF8A8A", "#FFD5C7"], // Gradient 12
    ["#C6FFC6", "#F1FFC4"], // Gradient 13
    ["#B8EAB0", "#DFFFC6"], // Gradient 14
    ["#99E8FF", "#FFB88A"], // Gradient 15
    ["#B9F0FF", "#ECF3FF"], // Gradient 16
    ["#99EBC3", "#FFF5A3"], // Gradient 17
    ["#CE99FF", "#F599FF"], // Gradient 18
    ["#FFB8B3", "#FFDBC6"], // Gradient 19
    ["#FFCC99", "#FFF1B3"], // Gradient 20
  ];

  // Use the id to pick a gradient, using modulo to wrap around if id exceeds array length
  const index = stringToNumber(id) % gradients.length;
  return gradients[index];
}

export function abbreviateFromNow(momentDuration: moment.Moment) {
  const fromNowString = momentDuration.fromNow();

  // handle the a few seconds ago case
  if (fromNowString === "a few seconds ago") {
    // handle the a few seconds ago case
    return "now";
  }

  // Define abbreviations
  const abbreviations: Record<string, string> = {
    seconds: "sec",
    second: "sec",
    minutes: "m",
    minute: "m",
    hours: "h",
    hour: "h",
    days: "d",
    day: "d",
    months: "mo",
    month: "mo",
    years: "y",
    year: "y",
  };

  // Replace 'a ' or 'an ' with '1' and full words with abbreviations
  let abbreviated = fromNowString.replace(/\ba(n)?\b/g, "1");
  abbreviated = abbreviated.replace(
    /\b(seconds|second|minutes|minute|hours|hour|days|day|months|month|years|year)\b/g,
    (matched) => abbreviations[matched]
  );

  // Remove spaces between numbers and abbreviations
  abbreviated = abbreviated.replace(/(\d) (\w)/g, "$1$2");

  return abbreviated;
}
