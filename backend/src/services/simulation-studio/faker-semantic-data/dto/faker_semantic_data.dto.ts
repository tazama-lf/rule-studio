export class FakerSemanticDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: ['name1', 'name2'] })
  name: string[];
}

export class FakerSemanticDataListDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Data fetched successfully' })
  message: string;

  @ApiProperty({ type: [FakerSemanticDataDto] })
  data: FakerSemanticDataDto[];
}
