import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Rating,
} from '@mui/material';

const MovieRecommendation = ({ recommendations }) => {
  return (
    <Grid container spacing={2}>
      {recommendations.map((movie) => (
        <Grid item xs={12} sm={6} key={movie.id}>
          <Card sx={{ display: 'flex', height: '100%' }}>
            <CardMedia
              component="img"
              sx={{ width: 100 }}
              image={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
              }}
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" gutterBottom noWrap>
                {movie.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {new Date(movie.release_date).getFullYear()}
              </Typography>
              <Rating
                value={movie.vote_average / 2}
                precision={0.5}
                readOnly
                size="small"
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mt: 1,
                }}
              >
                {movie.overview}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MovieRecommendation; 