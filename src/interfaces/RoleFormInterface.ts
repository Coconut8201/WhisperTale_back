export interface RoleFormInterface {
    style:string,
    mainCharacter:string,
    description:string,
    otherCharacters:Array<string>,
    relationships?: Array<{
        role1:string,
        role2:string,
        relationship:string,
    }>,
}