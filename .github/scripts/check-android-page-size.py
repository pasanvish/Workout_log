"""Verify 16 KB load segment alignment for the 64-bit libraries in the APK."""

from struct import unpack_from
from sys import argv
from zipfile import ZipFile


with ZipFile(argv[1]) as apk:
    libraries = [
        name for name in apk.namelist()
        if name.startswith(("lib/arm64-v8a/", "lib/x86_64/")) and name.endswith(".so")
    ]
    if not libraries:
        raise SystemExit("Expected 64-bit native libraries in the APK.")

    for name in libraries:
        elf = apk.read(name)
        if not elf.startswith(b"\x7fELF\x02\x01"):
            raise SystemExit(f"{name} is not a little-endian 64-bit ELF library.")

        program_offset = unpack_from("<Q", elf, 32)[0]
        entry_size, entry_count = unpack_from("<HH", elf, 54)
        headers = range(program_offset, program_offset + entry_size * entry_count, entry_size)
        load_alignments = [
            unpack_from("<Q", elf, offset + 48)[0]
            for offset in headers if unpack_from("<I", elf, offset)[0] == 1
        ]
        if not load_alignments or min(load_alignments) < 16384:
            raise SystemExit(f"{name} has a load segment below 16 KB alignment.")
        print(f"{name} supports 16 KB alignment.")
