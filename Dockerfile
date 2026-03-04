FROM ubuntu:14.04

RUN apt-get update && apt-get install -y build-essential csh dos2unix && apt-get clean

ADD . /opt/rom

RUN cd /opt/rom/src && make -k
RUN mkdir -p /opt/rom/log
RUN mkdir -p /opt/rom/player
RUN dos2unix /opt/rom/area/startup
RUN chmod +x /opt/rom/area/startup

WORKDIR /opt/rom/area

VOLUME [ "/opt/rom" ]
EXPOSE 4000

CMD [ "csh", "./startup" ]
