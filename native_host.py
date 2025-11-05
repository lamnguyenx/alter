#!/usr/bin/env python3

import sys
import json
import struct
import subprocess
import os

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('@I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def execute_command(command, url):
    try:
        full_command = f"{command} {url}"

        # Set a comprehensive PATH that includes common installation locations
        env = os.environ.copy()
        env['PATH'] = '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:' + env.get('PATH', '')

        result = subprocess.run(full_command, shell=True, capture_output=True, text=True, env=env)
        return {
            'success': True,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

while True:
    try:
        message = get_message()
        result = execute_command(message['command'], message['url'])
        send_message(result)
    except Exception as e:
        send_message({'success': False, 'error': str(e)})
