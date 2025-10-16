import { Box, IconButton } from "@mui/material";
import MinimizeIcon from "@mui/icons-material/Remove";
import MaximizeIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import theme from "src/lib/theme";

export function WindowControls() {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.ipcRenderer.send("window-minimize");
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.ipcRenderer.send("window-maximize");
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.ipcRenderer.send("window-close");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0,
        height: "100%",
        alignItems: "center",
      }}
    >
      <IconButton
        size="small"
        onClick={handleMinimize}
        sx={{
          color: "#FFF",
          borderRadius: 0,
          height: 48,
          width: 46,
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <MinimizeIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleMaximize}
        sx={{
          color: "#FFF",
          borderRadius: 0,
          height: 48,
          width: 46,
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <MaximizeIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleClose}
        sx={{
          color: "#FFF",
          borderRadius: 0,
          height: 48,
          width: 46,
          "&:hover": {
            backgroundColor: (theme) => theme.palette.error.main,
          },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
