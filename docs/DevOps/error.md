Run ansible-playbook -i ansible/ansible_inventory.txt ansible/ansible_playbook.txt --extra-vars "@extra-vars.yml"
Warning: : While constructing a mapping from /home/runner/work/bookmynurse-
devops-/bookmynurse-devops-/ansible/ansible_playbook.txt, line 5, column 3,
found a duplicate dict key (vars_prompt). Using last defined value only.
Warning: : Not prompting as we are not in interactive mode

PLAY [BookMyNurse DevOps Infrastructure Setup] *********************************

TASK [Gathering Facts] *********************************************************
fatal: [bookmynurse-test]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: ssh: connect to host 192.168.3.194 port 22: Connection timed out", "unreachable": true}

PLAY RECAP *********************************************************************
bookmynurse-test           : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0   

Error: Process completed with exit code 4. 