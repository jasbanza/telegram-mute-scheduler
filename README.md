# telegram-mute-scheduler
Scheduler for muting group & user notifications on Telegram.

```bash
git clone https://github.com/jasbanza/telegram-mute-scheduler.git

```
```bash
cd telegram-mute-scheduler
```
```bash
npm install

```
```bash
cp /config/config-template.json /config/config.json

```
edit config.json accordingly

#permissions on config folder 


```bash
chown root -R config
chmod 766 -R config
```

#path to node executable in the service file (which node)


```bash
cp telegram-mute-scheduler.service /etc/systemd/system/telegram-mute-scheduler.service
```
```bash
sudo chmod 755 /etc/systemd/system/telegram-mute-scheduler.service
```
restart systemctl 

```bash
systemctl daemon-restart
```

Check status of mute scheduler background process:

```bash
systemctl status telegram-mute-scheduler
```

Port 3000 through firewall
```bash
ufw allow 3000
```
check if web server is running on port 3000