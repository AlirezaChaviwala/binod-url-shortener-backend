const responseCodes={
    INTERNAL_SERVER_ERROR:500,
    SUCCESS:200,
    CONFLICT:409,
    VALIDATION_ERROR:422,
    NOT_FOUND:404,
    UNAUTHORIZED:401
}

const responseStatuses={
    INTERNAL_SERVER_ERROR:'Internal Server Error',
    SUCCESS:'Success',
    CONFLICT:'Conflict',
    VALIDATION_ERROR:"Validation Error",
    NOT_FOUND:"Not Found",
    UNAUTHORIZED:"Unauthorized"
}

const refreshTokenMaxAge=30 * 24 * 60 * 60 * 1000;

const authenticationStringMaxAge=60 * 10*1000;

module.exports={
    responseCodes,
    responseStatuses,
    refreshTokenMaxAge,
    authenticationStringMaxAge
}