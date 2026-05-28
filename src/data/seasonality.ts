export type MonthName =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

export const seasonalByMonth: Record<MonthName, string[]> = {
  january: ["citrus", "sweet potatoes", "winter squash", "cabbage"],
  february: ["citrus", "kale", "root vegetables"],
  march: ["spinach", "peas", "asparagus"],
  april: ["asparagus", "spring greens", "radishes"],
  may: ["strawberries", "asparagus", "peas"],
  june: ["strawberries", "zucchini", "cherries"],
  july: ["tomatoes", "corn", "berries", "peaches"],
  august: ["tomatoes", "corn", "eggplant", "melon"],
  september: ["apples", "squash", "corn", "pears"],
  october: ["apples", "pumpkin", "squash", "brussels sprouts"],
  november: ["sweet potatoes", "cranberries", "squash"],
  december: ["citrus", "root vegetables", "winter squash"],
};

const MONTHS: MonthName[] = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function currentSeasonalIngredients(date: Date = new Date()): string[] {
  return seasonalByMonth[MONTHS[date.getMonth()]];
}
