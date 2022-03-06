export const ErrorCodesDescriptors = [
    'Success',
    'Operation not permitted',
    'No such file or directory',
    'No such process',
    'Interrupted system call',
    'I/O error',
    'No such device or address',
    'Argument list too long',
    'Exec format error',
    'Bad file number',
    'No child processes',
    'Try again',
    'Out of memory',
    'Permission denied',
    'Bad address',
    'Block device required',
    'Device or resource busy',
    'File exists',
    'Cross-device link',
    'No such device',
    'Not a directory',
    'Is a directory',
    'Invalid argument',
    'File table overflow',
    'Too many open files',
    'Not a typewriter',
    'Text file busy',
    'File too large',
    'No space left on device',
    'Illegal seek',
    'Read-only file system',
    'Too many links',
    'Broken pipe',
    'Math argument out of domain of func',
    'Math result not representable',
    'Resource deadlock would occur',
    'File name too long',
    'No record locks available',
    'Invalid system call number',
    'Directory not empty',
    'Too many symbolic links encountered',
    'Operation would block',
    'No message of desired type',
    'Identifier removed',
    'Channel number out of range',
    'Level 2 not synchronized',
    'Level 3 halted',
    'Level 3 reset',
    'Link number out of range',
    'Protocol driver not attached',
    'No CSI structure available',
    'Level 2 halted',
    'Invalid exchange',
    'Invalid request descriptor',
    'Exchange full',
    'No anode',
    'Invalid request code',
    'Invalid slot',
    'EDEADLK',
    'Bad font file format',
    'Device not a stream',
    'No data available',
    'Timer expired',
    'Out of streams resources',
    'Machine is not on the network',
    'Package not installed',
    'Object is remote',
    'Link has been severed',
    'Advertise error',
    'Srmount error',
    'Communication error on send',
    'Protocol error',
    'Multihop attempted',
    'RFS specific error',
    'Not a data message',
    'Value too large for defined data type',
    'Name not unique on network',
    'File descriptor in bad state',
    'Remote address changed',
    'Can not access a needed shared library',
    'Accessing a corrupted shared library',
    '.lib section in a.out corrupted',
    'Attempting to link in too many shared libraries',
    'Cannot exec a shared library directly',
    'Illegal byte sequence',
    'Interrupted system call should be restarted',
    'Streams pipe error',
    'Too many users',
    'Socket operation on non-socket',
    'Destination address required',
    'Message too long',
    'Protocol wrong type for socket',
    'Protocol not available',
    'Protocol not supported',
    'Socket type not supported',
    'Operation not supported on transport endpoint',
    'Protocol family not supported',
    'Address family not supported by protocol',
    'Address already in use',
    'Cannot assign requested address',
    'Network is down',
    'Network is unreachable',
    'Network dropped connection because of reset',
    'Software caused connection abort',
    'Connection reset by peer',
    'No buffer space available',
    'Transport endpoint is already connected',
    'Transport endpoint is not connected',
    'Cannot send after transport endpoint shutdown',
    'Too many references: cannot splice',
    'Connection timed out',
    'Connection refused',
    'Host is down',
    'No route to host',
    'Operation already in progress',
    'Operation now in progress',
    'Stale file handle',
    'Structure needs cleaning',
    'Not a XENIX named type file',
    'No XENIX semaphores available',
    'Is a named type file',
    'Remote I/O error',
    'Quota exceeded',
    'No medium found',
    'Wrong medium type',
    'Operation Canceled',
    'Required key not available',
    'Key has expired',
    'Key has been revoked',
    'Key was rejected by service',
    'Owner died',
    'State not recoverable',
    'Operation not possible due to RF-kill',
    'Memory page has hardware error'];

export enum LinuxExitCode {
    'SUCCESS',
    'EPERM',      /* Operation not permitted */
    'ENOENT',    /* No such file or directory */
    'ESRCH',    /* No such process */
    'EINTR',    /* Interrupted system call */
    'EIO',    /* I/O error */
    'ENXIO',    /* No such device or address */
    'E2BIG',    /* Argument list too long */
    'ENOEXEC',    /* Exec format error */
    'EBADF',    /* Bad file number */
    'ECHILD',    /* No child processes */
    'EAGAIN',    /* Try again */
    'ENOMEM',    /* Out of memory */
    'EACCES',    /* Permission denied */
    'EFAULT',    /* Bad address */
    'ENOTBLK',    /* Block device required */
    'EBUSY',    /* Device or resource busy */
    'EEXIST',    /* File exists */
    'EXDEV',    /* Cross-device link */
    'ENODEV',    /* No such device */
    'ENOTDIR',    /* Not a directory */
    'EISDIR',    /* Is a directory */
    'EINVAL',    /* Invalid argument */
    'ENFILE',    /* File table overflow */
    'EMFILE',    /* Too many open files */
    'ENOTTY',    /* Not a typewriter */
    'ETXTBSY',    /* Text file busy */
    'EFBIG',    /* File too large */
    'ENOSPC',    /* No space left on device */
    'ESPIPE',    /* Illegal seek */
    'EROFS',    /* Read-only file system */
    'EMLINK',    /* Too many links */
    'EPIPE',    /* Broken pipe */
    'EDOM',    /* Math argument out of domain of func */
    'ERANGE',    /* Math result not representable */
    'EDEADLK',    /* Resource deadlock would occur */
    'ENAMETOOLONG',    /* File name too long */
    'ENOLCK',    /* No record locks available */
    'ENOSYS',    /* Invalid system call number */
    'ENOTEMPTY',    /* Directory not empty */
    'ELOOP',    /* Too many symbolic links encountered */
    'EWOULDBLOCK',/* Operation would block */
    'ENOMSG',    /* No message of desired type */
    'EIDRM',    /* Identifier removed */
    'ECHRNG',    /* Channel number out of range */
    'EL2NSYNC',    /* Level 2 not synchronized */
    'EL3HLT',    /* Level 3 halted */
    'EL3RST',    /* Level 3 reset */
    'ELNRNG',    /* Link number out of range */
    'EUNATCH',    /* Protocol driver not attached */
    'ENOCSI',    /* No CSI structure available */
    'EL2HLT',    /* Level 2 halted */
    'EBADE',    /* Invalid exchange */
    'EBADR',    /* Invalid request descriptor */
    'EXFULL',    /* Exchange full */
    'ENOANO',    /* No anode */
    'EBADRQC',    /* Invalid request code */
    'EBADSLT',    /* Invalid slot */
    'EDEADLOCK',    /* EDEADLK */
    'EBFONT',    /* Bad font file format */
    'ENOSTR',    /* Device not a stream */
    'ENODATA',    /* No data available */
    'ETIME',    /* Timer expired */
    'ENOSR',    /* Out of streams resources */
    'ENONET',    /* Machine is not on the network */
    'ENOPKG',    /* Package not installed */
    'EREMOTE',    /* Object is remote */
    'ENOLINK',    /* Link has been severed */
    'EADV',    /* Advertise error */
    'ESRMNT',    /* Srmount error */
    'ECOMM',    /* Communication error on send */
    'EPROTO',    /* Protocol error */
    'EMULTIHOP',    /* Multihop attempted */
    'EDOTDOT',    /* RFS specific error */
    'EBADMSG',    /* Not a data message */
    'EOVERFLOW',    /* Value too large for defined data type */
    'ENOTUNIQ',    /* Name not unique on network */
    'EBADFD',    /* File descriptor in bad state */
    'EREMCHG',    /* Remote address changed */
    'ELIBACC',    /* Can not access a needed shared library */
    'ELIBBAD',    /* Accessing a corrupted shared library */
    'ELIBSCN',    /* .lib section in a.out corrupted */
    'ELIBMAX',    /* Attempting to link in too many shared libraries */
    'ELIBEXEC',    /* Cannot exec a shared library directly */
    'EILSEQ',    /* Illegal byte sequence */
    'ERESTART',    /* Interrupted system call should be restarted */
    'ESTRPIPE',    /* Streams pipe error */
    'EUSERS',    /* Too many users */
    'ENOTSOCK',    /* Socket operation on non-socket */
    'EDESTADDRREQ',    /* Destination address required */
    'EMSGSIZE',    /* Message too long */
    'EPROTOTYPE',    /* Protocol wrong type for socket */
    'ENOPROTOOPT',    /* Protocol not available */
    'EPROTONOSUPPORT',    /* Protocol not supported */
    'ESOCKTNOSUPPORT',    /* Socket type not supported */
    'EOPNOTSUPP',    /* Operation not supported on transport endpoint */
    'EPFNOSUPPORT',    /* Protocol family not supported */
    'EAFNOSUPPORT',    /* Address family not supported by protocol */
    'EADDRINUSE',    /* Address already in use */
    'EADDRNOTAVAIL',    /* Cannot assign requested address */
    'ENETDOWN',    /* Network is down */
    'ENETUNREACH',    /* Network is unreachable */
    'ENETRESET',    /* Network dropped connection because of reset */
    'ECONNABORTED',    /* Software caused connection abort */
    'ECONNRESET',    /* Connection reset by peer */
    'ENOBUFS',    /* No buffer space available */
    'EISCONN',    /* Transport endpoint is already connected */
    'ENOTCONN',    /* Transport endpoint is not connected */
    'ESHUTDOWN',    /* Cannot send after transport endpoint shutdown */
    'ETOOMANYREFS',    /* Too many references: cannot splice */
    'ETIMEDOUT',    /* Connection timed out */
    'ECONNREFUSED',    /* Connection refused */
    'EHOSTDOWN',    /* Host is down */
    'EHOSTUNREACH',    /* No route to host */
    'EALREADY',    /* Operation already in progress */
    'EINPROGRESS',    /* Operation now in progress */
    'ESTALE',    /* Stale file handle */
    'EUCLEAN',    /* Structure needs cleaning */
    'ENOTNAM',    /* Not a XENIX named type file */
    'ENAVAIL',    /* No XENIX semaphores available */
    'EISNAM',    /* Is a named type file */
    'EREMOTEIO',    /* Remote I/O error */
    'EDQUOT',    /* Quota exceeded */
    'ENOMEDIUM',    /* No medium found */
    'EMEDIUMTYPE',    /* Wrong medium type */
    'ECANCELED',    /* Operation Canceled */
    'ENOKEY',    /* Required key not available */
    'EKEYEXPIRED',    /* Key has expired */
    'EKEYREVOKED',    /* Key has been revoked */
    'EKEYREJECTED',    /* Key was rejected by service */
    'EOWNERDEAD',    /* Owner died */
    'ENOTRECOVERABLE',    /* State not recoverable */
    'ERFKILL',    /* Operation not possible due to RF-kill */
    'EHWPOISON',    /* Memory page has hardware error */
}
