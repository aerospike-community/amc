################################################################################
# build/golang:1.7
################################################################################

# Base Image
FROM golang:1.7

# Dependencies
RUN apt-get update
RUN apt-get install -y build-essential

RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

RUN npm install grunt -g

RUN apt-get install -y ruby ruby-dev rubygems gcc make
RUN gem install --no-ri --no-rdoc fpm
RUN apt-get install -y rpm

RUN apt-get install -y zip tar gzip
