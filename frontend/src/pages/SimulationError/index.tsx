import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";

const SimulationError = () => {
  const navigate = useNavigate();

  return (
    <BoxWrapper>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="65vh">
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            maxWidth: 560,
            p: 4,
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width={72}
              height={72}
              borderRadius="50%"
              bgcolor="#fce8e6"
            >
              <ErrorOutlineIcon sx={{ color: "#d32f2f", fontSize: 38 }} />
            </Box>

            <Text weight="bold" color="black" size="header">
              Failed to complete Simulation
            </Text>

            <Text color="text.ternary" size="sub">
              The simulation run did not finish successfully. Please retry or return to the simulation history to check the status.
            </Text>

            <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} width="100%" justifyContent="center" mt={2}>
              <Button
                text="Back to listing"
                type="secondary"
                size="md"
                width="100%"
                onClick={() => navigate("/simulation")}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </BoxWrapper>
  );
};

export default SimulationError;
