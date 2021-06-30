FROM debian:stretch-slim 

ARG AMC_VERSION=5.0.0

RUN apt update -y \
    && apt -y install wget procps \
    && wget https://github.com/aerospike-community/amc/releases/download/${AMC_VERSION}/aerospike-amc-enterprise-${AMC_VERSION}_amd64.deb --no-check-certificate \
    && dpkg -i aerospike-amc-enterprise-${AMC_VERSION}_amd64.deb \
    && rm aerospike-amc-enterprise-${AMC_VERSION}_amd64.deb \
    && dpkg -r wget ca-certificates \
    && dpkg --purge wget ca-certificates \
    && apt-get purge -y \
    && apt autoremove -y 

COPY ./deployment/common/amc.docker.sh /opt/amc/amc.docker.sh

EXPOSE 8081

ENTRYPOINT [ "/opt/amc/amc.docker.sh", "amc" ]
