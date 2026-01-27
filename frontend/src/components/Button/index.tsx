import React, { memo } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";


type ButtonProps = {
  onClick: () => void;
  Icon?: React.ElementType;
  disabled?: boolean;
  text: string;
  type?: "primary" | "secondary" | "muted" | "danger" | "success" | "default" | 'simple';
  outlined?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg" | "";
  height?: string
  width?: string
};

const MuiButton = ({
  onClick,
  Icon,
  disabled = false,
  text = "Button",
  type = "primary",
  outlined = false,
  loading = false,
  size = "md",
  height = '50px',
  width,
}: ButtonProps) => {
  const colors = {
    primary: {
      main: "#33ad74",
      contrastText: "#fff",
    },
    secondary: {
      main: "#2b7fff",
      contrastText: "#fff",
    },
    muted: {
      main: "#e0e0e0",
      contrastText: "#555",
    },
    simple: {
      main: "#d6dadf",
      contrastText: "#000",
    },
    danger: {
      main: "#d32f2f",
      contrastText: "#fff",
    },
    success: {
      main: "#66c1bb",
      contrastText: "#fff",
    },
    default: {
      main: "#000",
      contrastText: "#fff",
    },
  };

  const widths: Record<string, string> = {
    sm: "120px",
    md: "200px",
    lg: "100%",
    "": "auto",
  };

  const selected = colors[type] || colors.default;

  const onPress = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick?.();
  };

  return (
    <Button
      onClick={onPress}
      disabled={disabled || loading}
      variant={outlined ? "outlined" : "contained"}
      startIcon={(!loading && Icon) && <Icon />}
      sx={{
        height,
        borderRadius: "6px",
        width: width ?? widths[size],
        textTransform: "none",
        fontSize: "1rem",
        ...(outlined
          ? {
            color: selected.contrastText,
            borderColor: selected.main,
          }
          : {
            backgroundColor: selected.main,
            color: selected.contrastText,
            "&:hover": {
              backgroundColor: selected.main,
            },
          }),
      }}
    >
      {loading ? (
        <CircularProgress
          size={18}
          sx={{
            color: outlined ? selected.main : selected.contrastText,
          }}
        />
      ) : (
        text
      )}
    </Button>
  );
};

export default memo(MuiButton);
