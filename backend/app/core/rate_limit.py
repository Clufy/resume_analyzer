from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize limiter with remote address key function
# This will limit by IP address
limiter = Limiter(key_func=get_remote_address)
