import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { NumberTextField } from './NumberTextField';

interface VatPriceFieldProps {
  label?: string;
  name: string;
  value: number;
  vatRate: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  precision?: number;
  min?: number;
  grayWhenZero?: boolean;
}

export function VatPriceField({
  label,
  name,
  value,
  vatRate,
  onChange,
  error,
  precision = 2,
  min = 0,
  grayWhenZero,
}: VatPriceFieldProps) {
  const [basePrice, setBasePrice] = useState<number>(value);
  
  const numericBasePrice = Number(basePrice) || 0;
  
  // Calculate raw values
  let calculatedVatAmount = numericBasePrice * (vatRate / 100);
  let calculatedPriceWithVat = numericBasePrice + calculatedVatAmount;

  // Smart rounding: transfer 1 cent between D and F when F is .99 or .01
  if (vatRate > 0 && numericBasePrice > 0) {
    const cents = Math.round((calculatedPriceWithVat % 1) * 100);
    
    if (cents === 99) {
      // F ends in .99 -> take .01 FROM D, give TO F
      // D decreases, F increases
      calculatedVatAmount += 0.01;
      // calculatedPriceWithVat += 0.01;

      // calculatedVatAmount -= 0.01;
      // calculatedPriceWithVat += 0.01;
    } else if (cents === 1) {
      // F ends in .01 -> take .01 FROM F, give TO D
      // D increases, F decreases
      calculatedVatAmount -= 0.01;
      // calculatedPriceWithVat -= 0.01;

      // calculatedVatAmount += 0.01;
      // calculatedPriceWithVat -= 0.01;
    }
    calculatedPriceWithVat = numericBasePrice + calculatedVatAmount;
  }

  const vatAmount = calculatedVatAmount;
  const priceWithVat = calculatedPriceWithVat;

  useEffect(() => {
    setBasePrice(Number(value) || 0);
  }, [value]);

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBase = Number(parseFloat(e.target.value)) || 0;
    setBasePrice(newBase);
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: String(newBase),
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  const handleWithVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceWithVat = Number(parseFloat(e.target.value)) || 0;
    const newBase = newPriceWithVat / (1 + vatRate / 100);
    setBasePrice(newBase);
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: String(newBase),
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  return (
    <Box>
      {label && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            mb: 0.5,
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
        <NumberTextField
          label="Základ"
          name={`${name}_base`}
          value={basePrice}
          onChange={handleBaseChange}
          precision={precision}
          min={min}
          grayWhenZero={grayWhenZero}
          size="small"
        />
        <NumberTextField
          label="DPH"
          name={`${name}_vat`}
          value={vatAmount}
          onChange={() => {}}
          precision={precision}
          disabled
          size="small"
          sx={{
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
              backgroundColor: '#f5f5f5',
            },
          }}
        />
        <NumberTextField
          label="S DPH"
          name={`${name}_with_vat`}
          value={priceWithVat}
          onChange={handleWithVatChange}
          precision={precision}
          min={min}
          grayWhenZero={grayWhenZero}
          size="small"
        />
      </Box>
      {error && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ display: 'block', mt: 0.5, ml: 1.75 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}