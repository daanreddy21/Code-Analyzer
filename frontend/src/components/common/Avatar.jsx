function Avatar({ name, image, size = 40 }) {
  const firstLetter = name ? name.charAt(0).toUpperCase() : "?";

  // 🎨 random color based on name (consistent)
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  if (image) {
    return (
      <img
        src={image}
        alt="avatar"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover"
        }}
      />
    );
  }

  // 🔥 Default avatar (initial)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[colorIndex],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: size / 2
      }}
    >
      {firstLetter}
    </div>
  );
}

export default Avatar;