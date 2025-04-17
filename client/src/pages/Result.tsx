import React from 'react';
import {
  Box, Typography, TextField, Autocomplete, Button, Slider,
  Radio, RadioGroup, FormControlLabel, FormLabel, Select, MenuItem
} from '@mui/material';

const animeOptions = [
  { label: 'Naruto' }, { label: 'Bleach' }, { label: 'Attack on Titan' }
];

const Result: React.FC = () => {
  return (
    <Box display="flex" height="calc(100vh - 128px)">
      {/* Sidebar */}
      <Box
        width="300px"
        p={3}
        bgcolor="#f9f9f9"
        borderRight="1px solid #ddd"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        <Box>
          <Typography variant="h6" gutterBottom>Release Year</Typography>
          <TextField label="Before" variant="outlined" fullWidth margin="dense" />
          <TextField label="After" variant="outlined" fullWidth margin="dense" />
        </Box>

        <Box>
          <FormLabel component="legend">Season</FormLabel>
          <RadioGroup row defaultValue="Spring">
            <FormControlLabel value="Spring" control={<Radio />} label="Spring" />
            <FormControlLabel value="Summer" control={<Radio />} label="Summer" />
            <FormControlLabel value="Autumn" control={<Radio />} label="Autumn" />
            <FormControlLabel value="Winter" control={<Radio />} label="Winter" />
          </RadioGroup>
        </Box>

        <Box>
          <Typography gutterBottom>Rating</Typography>
          <Slider
            defaultValue={[0, 10]}
            valueLabelDisplay="auto"
            min={0}
            max={10}
          />
        </Box>

        <Box>
          <Typography gutterBottom>Sort by</Typography>
          <Select defaultValue="rating" fullWidth>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="year">Release Year</MenuItem>
            <MenuItem value="season">Season</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} p={4} overflow="auto">
        {/* Top search row */}
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Found 12 results!
          </Typography>
        </Box>

        <Box display="flex" gap={2} mb={4}>
          <Autocomplete
            options={animeOptions}
            getOptionLabel={(opt) => opt.label}
            renderInput={(params) => <TextField {...params} label="Anime 1" />}
            sx={{ width: 300 }}
          />
          <Autocomplete
            options={animeOptions}
            getOptionLabel={(opt) => opt.label}
            renderInput={(params) => <TextField {...params} label="Anime 2" />}
            sx={{ width: 300 }}
          />
          <Button variant="contained" sx={{ borderRadius: 5, px: 4 }}>
            Search
          </Button>
        </Box>

        {/* Anime cards */}
        <Box display="flex" flexDirection="column" gap={3}>
          {[1, 2].map((_, idx) => (
            <Box
              key={idx}
              p={3}
              border="1px solid #ccc"
              borderRadius="20px"
              bgcolor="white"
              display="flex"
              flexDirection="column"
            >
              <Typography variant="h6">Anime name</Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Short anime description
              </Typography>
              <Box display="flex" justifyContent="space-between" textAlign="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">Rating</Typography>
                  <Typography>9.9</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="bold">Release Year</Typography>
                  <Typography>1308</Typography>
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="bold">Season</Typography>
                  <Typography>Summer</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Result;
