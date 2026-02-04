import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  Divider,
  Badge,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate } from 'react-router-dom';
import { StyledToolbar, ButtonGroup, ActionButton } from './styles';
import { useValidationContext } from '../../../validation/context';

interface HeaderProps {
  isPlaying?: boolean;
  isPaused?: boolean;
  onPlayClick: () => void;
  onPauseClick?: () => void;
  onResumeClick?: () => void;
  onStopClick: () => void;
  onDisplayJson: () => void;
  onGenerateCode: () => void;
  onViewErrors?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  viewOnly?: boolean;
  hidePlayControls?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isPlaying = false,
  isPaused = false,
  onPlayClick,
  onPauseClick,
  onResumeClick,
  onStopClick,
  onDisplayJson,
  onGenerateCode,
  onViewErrors,
  onSave,
  isSaving = false,
  disabled = false,
  viewOnly = false,
  hidePlayControls = false,
}) => {
  const { hasErrors, getErrorCount } = useValidationContext();
  const navigate = useNavigate();
  
  const isDisabled = disabled || hasErrors;
  
  return (
    <Paper elevation={0} square>
      <StyledToolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Back to Editor">
            <IconButton
              onClick={() => navigate('/editor?tab=rule_builder')}
              color="primary"
              size="medium"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <AccountTreeIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography
            variant="h6"
            component="h1"
            fontWeight={600}
            color="text.primary"
          >
            Rule Builder {viewOnly && '(View Only)'}
          </Typography>
        </Box>

        <ButtonGroup>
          {!hidePlayControls && (
            <>
              {!isPlaying ? (
                <Tooltip title={hasErrors ? 'Fix validation errors before running' : 'Run flow animation'}>
                  <span>
                    <ActionButton
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={onPlayClick}
                      disabled={isDisabled}
                      sx={{
                        minWidth: '100px',
                      }}
                    >
                      Play
                    </ActionButton>
                  </span>
                </Tooltip>
              ) : (
                <>
                  {isPaused ? (
                    <Tooltip title="Resume execution">
                      <ActionButton
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrowIcon />}
                        onClick={onResumeClick}
                        sx={{
                          minWidth: '100px',
                        }}
                      >
                        Resume
                      </ActionButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Pause execution">
                      <ActionButton
                        variant="contained"
                        color="warning"
                        startIcon={<PauseIcon />}
                        onClick={onPauseClick}
                        sx={{
                          minWidth: '100px',
                        }}
                      >
                        Pause
                      </ActionButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Stop and reset">
                    <ActionButton
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={onStopClick}
                      sx={{
                        minWidth: '100px',
                      }}
                    >
                      Stop
                    </ActionButton>
                  </Tooltip>
                </>
              )}

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {!viewOnly && onSave && (
            <>
              <Tooltip title={hasErrors ? 'Fix validation errors before saving' : 'Save flow changes'}>
                <span>
                  <ActionButton
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={onSave}
                    disabled={isDisabled || isPlaying || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </ActionButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          <Tooltip title={hasErrors ? 'Fix validation errors before viewing JSON' : 'View flow structure as JSON'}>
            <span>
              <ActionButton
                variant="outlined"
                color="info"
                startIcon={<DataObjectIcon />}
                onClick={onDisplayJson}
                disabled={isDisabled || isPlaying}
              >
                Display JSON
              </ActionButton>
            </span>
          </Tooltip>

          <Tooltip title={hasErrors ? 'Fix validation errors before generating code' : 'Generate executable TypeScript code'}>
            <span>
              <ActionButton
                variant="contained"
                color="secondary"
                startIcon={<CodeIcon />}
                onClick={onGenerateCode}
                disabled={isDisabled || isPlaying}
                sx={{
                  background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                  boxShadow: '0 2px 4px rgba(156, 39, 176, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)',
                    boxShadow: '0 3px 6px rgba(156, 39, 176, 0.4)',
                  },
                }}
              >
                Generate Code
              </ActionButton>
            </span>
          </Tooltip>

          {hasErrors && onViewErrors && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="View all validation errors">
                <Badge badgeContent={getErrorCount()} color="error">
                  <ActionButton
                    variant="outlined"
                    color="error"
                    startIcon={<ErrorOutlineIcon />}
                    onClick={onViewErrors}
                  >
                    View Errors
                  </ActionButton>
                </Badge>
              </Tooltip>
            </>
          )}
        </ButtonGroup>
      </StyledToolbar>
    </Paper>
  );
};

export default Header;
