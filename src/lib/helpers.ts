export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Use UTC methods to ensure consistent output
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} UTC`;
};
