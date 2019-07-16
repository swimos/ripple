[Unit]
Description=Swim Ripple
Wants=network.target

[Service]
EnvironmentFile=-/etc/sysconfig/swim-ripple
ExecStart=/opt/swim-ripple/bin/swim-ripple
User=swim-ripple
Restart=on-failure
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
