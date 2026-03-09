export function formatProgErr(error_code) {
    let strDescription = 'Unknown';

    if(error_code === 1) strDescription = 'PROG_ERR_FAILED';
    else if(error_code === 2) strDescription = 'PROG_ERR_FW_INVALID';
    else if(error_code === 3) strDescription = 'PROG_ERR_FW_NOT_EXIST';
    else if(error_code === 4) strDescription = 'PROG_ERR_LOAD_FILE_FAILED';
    else if(error_code === 5) strDescription = 'PROG_ERR_HOOK_FAILED';
    else if(error_code === 6) strDescription = 'PROG_ERR_WRITE_FAILED';
    else if(error_code === 7) strDescription = 'PROG_ERR_VERIFYING_FAILED';
    else if(error_code === 8) strDescription = 'PROG_ERR_RW_FAILED';
    else if(error_code === 9) strDescription = 'PROG_ERR_DEVICE_WRONG';
    else if(error_code === 10) strDescription = 'PROG_ERR_DEVICE_NOT_SUPPORT';
    else if(error_code === 11) strDescription = 'PROG_ERR_INSTALL_FAILED';

    return strDescription;
};