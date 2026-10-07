import React, { useState } from 'react';
import { InputAdornment, IconButton, TextField, TextFieldProps } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

type PasswordInputProps = Omit<TextFieldProps, 'type'>;

const PasswordInput = (props: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...props.slotProps,
        input: {
          ...(props.slotProps?.input as any),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="Afficher ou masquer le mot de passe"
                onClick={() => setVisible(v => !v)}
                edge="end"
              >
                {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default PasswordInput;