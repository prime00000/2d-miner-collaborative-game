FROM nginx:alpine

# Copy all game files to nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# nginx runs by default, no need for CMD